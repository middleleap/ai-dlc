using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using Shuttle.Guards;

internal static class Program
{
    private static readonly Guid CaseA = Guid.Parse("11111111-1111-4111-8111-111111111111");
    private static readonly Guid CaseB = Guid.Parse("22222222-2222-4222-8222-222222222222");
    private static readonly Guid ArtifactA = Guid.Parse("33333333-3333-4333-8333-333333333333");
    private static readonly Guid ArtifactB = Guid.Parse("44444444-4444-4444-8444-444444444444");
    private static readonly Guid Actor = Guid.Parse("55555555-5555-4555-8555-555555555555");
    private static readonly Guid Writer = Guid.Parse("66666666-6666-4666-8666-666666666666");
    private static readonly Guid Related = Guid.Parse("77777777-7777-4777-8777-777777777777");
    private static readonly Guid PackKey = Guid.Parse("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    private static readonly Guid CommentKey = Guid.Parse("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    private static readonly string FileHash = new string('a', 64); // synthetic binding, not a file checksum
    private static int assertions;

    private static int Main()
    {
        var tests = new List<(string Name, Action Run)>
        {
            ("pack plans proposal/event/job without approving or claiming file saved", () => {
                var d = Accept(Pack()); Equal(1, d.Plan.ProposalCreates); Equal(1, d.Plan.BusinessEventCreates);
                Equal(1, d.Plan.ExternalWorkCreates); Equal(false, d.Plan.RequiresCaseCompareAndSwap);
                Equal(false, d.Plan.ChangesContentRevision); Equal(false, d.Plan.GrantsApproval);
                Equal(false, d.Plan.ClaimsArtifactSaved); Equal(Actor, d.Plan.InitiatingUserId); Equal(Writer, d.Plan.EffectiveUserId);
            }),
            ("comment plans event and explicit CAS without job or approval", () => {
                var d = Accept(Comment()); Equal(1, d.Plan.ProposalCreates); Equal(1, d.Plan.BusinessEventCreates);
                Equal(0, d.Plan.ExternalWorkCreates); Equal(true, d.Plan.RequiresCaseCompareAndSwap);
                Equal("42", d.Plan.ExpectedRowVersion); Equal((long?)8, d.Plan.NextGuardSequence);
                Equal(false, d.Plan.ChangesContentRevision); Equal(false, d.Plan.GrantsApproval);
            }),
            ("revoked case access denies before any receipt lookup", () => DeniedWithoutLookup(Pack(), Context(canReadCase:false), "ACCESS_DENIED")),
            ("revoked proposal read denies before lookup", () => DeniedWithoutLookup(Pack(), Context(canReadProposals:false), "ACCESS_DENIED")),
            ("cross-case request denies before lookup", () => DeniedWithoutLookup(Pack(), Context(caseId:CaseB), "ACCESS_DENIED")),
            ("missing authenticated actor denies before lookup", () => DeniedWithoutLookup(Pack(), Context(actor:Guid.Empty), "ACCESS_DENIED")),
            ("PackDraft operation requires its own permission", () => DeniedWithoutLookup(Pack(), Context(canPack:false), "OPERATION_DENIED")),
            ("comment operation requires its own permission", () => DeniedWithoutLookup(Comment(), Context(canComment:false), "OPERATION_DENIED")),
            ("unknown kind cannot default to permission", () => DeniedWithoutLookup(new Proposal(ProposalGuard.SchemaVersion,(ProposalKind)0,CaseA,1,PackKey),Context(),"OPERATION_DENIED")),
            ("revoked source access denies before receipt lookup", () => DeniedWithoutLookup(Pack(), Context(sourceAccess:false), "SOURCE_ACCESS_DENIED")),
            ("revoked artifact access denies before receipt lookup", () => DeniedWithoutLookup(Comment(), Context(artifactAccess:false), "ARTIFACT_ACCESS_DENIED")),
            ("revoked related comment denies before lookup", () => DeniedWithoutLookup(Comment(related:Related), Context(commentAccess:false), "COMMENT_ACCESS_DENIED")),
            ("fresh stale revision rejects", () => Reject(Pack(), Context(revision:2), "STALE_CONTENT_REVISION")),
            ("committed pack replay survives revision supersession with no writes", () => {
                var p = Pack(); var receipt = Receipt(p, ArtifactA); var lookup = new Lookup(receipt);
                var d = ProposalGuard.Evaluate(p,Context(revision:2),lookup);
                Equal(DecisionKind.ReplayReceipt,d.Kind); Same(receipt,d.Receipt); Equal(null,d.Plan);
                Equal(false,d.ClaimsCurrentAcceptance); Equal(1,lookup.Calls);
            }),
            ("committed comment replay survives artifact supersession with no CAS", () => {
                var p=Comment(); var old=Receipt(p,ArtifactA);
                var d=ProposalGuard.Evaluate(p,Context(revision:2,currentArtifact:Artifact(ArtifactB,CaseA,2)),new Lookup(old));
                Equal(DecisionKind.ReplayReceipt,d.Kind); Same(old,d.Receipt); Equal(null,d.Plan); Equal(false,d.ClaimsCurrentAcceptance);
            }),
            ("revoked caller cannot retrieve old receipt", () => DeniedWithoutLookup(Pack(),Context(canReadCase:false),"ACCESS_DENIED",Receipt(Pack()))),
            ("replay cannot disclose artifact after file access revocation", () => Reject(Pack(),Context(artifactAccess:false),"ARTIFACT_ACCESS_DENIED",Receipt(Pack(),ArtifactA))),
            ("same key changed payload conflicts", () => Reject(Pack(text:"changed"),Context(),"REQUEST_KEY_CONFLICT",Receipt(Pack()))),
            ("same case/key changed kind conflicts", () => Reject(Comment(requestKey:PackKey),Context(),"REQUEST_KEY_CONFLICT",Receipt(Pack()))),
            ("receipt from other case cannot leak through repository bug", () => {
                var p=Pack(); var wrong=new CommittedReceipt(Guid.NewGuid(),CaseB,PackKey,CanonicalProposal.Hash(p),"old");
                Reject(p,Context(),"RECEIPT_INTEGRITY",wrong);
            }),
            ("fresh comment with wrong artifact hash rejects", () => Reject(Comment(hash:new string('b',64)),Context(),"STALE_ARTIFACT_BINDING")),
            ("fresh comment cannot target old artifact", () => Reject(Comment(),Context(currentArtifact:Artifact(ArtifactB,CaseA,1)),"STALE_ARTIFACT_BINDING")),
            ("fresh comment rejects missing artifact", () => Reject(Comment(),Context(withArtifact:false),"STALE_ARTIFACT_BINDING")),
            ("fresh comment rejects failed artifact", () => Reject(Comment(),Context(currentArtifact:Artifact(ArtifactA,CaseA,1,false)),"STALE_ARTIFACT_BINDING")),
            ("fresh comment rejects artifact belonging to another case", () => Reject(Comment(),Context(currentArtifact:Artifact(ArtifactA,CaseB,1)),"STALE_ARTIFACT_BINDING")),
            ("fresh comment rejects artifact from older content", () => Reject(Comment(),Context(currentArtifact:Artifact(ArtifactA,CaseA,2)),"STALE_ARTIFACT_BINDING")),
            ("valid reply appends against same case/artifact", () => {
                var d=Accept(Comment(related:Related),Context(related:new RelatedCommentSnapshot(Related,CaseA,ArtifactA)));
                Equal(0,d.Plan.ExternalWorkCreates); Equal(1,d.Plan.ProposalCreates);
            }),
            ("reply cannot point to missing parent", () => Reject(Comment(related:Related),Context(),"INVALID_RELATED_COMMENT")),
            ("reply cannot point to another case", () => Reject(Comment(related:Related),Context(related:new RelatedCommentSnapshot(Related,CaseB,ArtifactA)),"INVALID_RELATED_COMMENT")),
            ("reply cannot retarget prior artifact history", () => Reject(Comment(related:Related),Context(related:new RelatedCommentSnapshot(Related,CaseA,ArtifactB)),"INVALID_RELATED_COMMENT")),
            ("comment needs real row-version snapshot for future CAS", () => Reject(Comment(),Context(rowVersion:""),"CONCURRENCY_CONTEXT_REQUIRED")),
            ("guard sequence overflow fails closed", () => Reject(Comment(),Context(guardSequence:long.MaxValue),"CONCURRENCY_CONTEXT_REQUIRED")),
            ("blank comments rejected", () => Reject(Comment(text:" \t\n"),Context(),"INVALID_COMMENT_PAYLOAD")),
            ("2000 Unicode scalars accepted but 2001 rejected", () => {
                Accept(Comment(text:string.Concat(Enumerable.Repeat("😀",2000))));
                Reject(Comment(text:string.Concat(Enumerable.Repeat("😀",2001))),Context(),"INVALID_COMMENT_PAYLOAD");
            }),
            ("inert angle-bracket text permitted, control bytes rejected", () => {
                Accept(Comment(text:"<script>literal text</script>\r\n\tNo execution."));
                Reject(Comment(text:"bad\0text"),Context(),"INVALID_COMMENT_PAYLOAD");
                Reject(Comment(text:"bad\u0085text"),Context(),"INVALID_COMMENT_PAYLOAD");
            }),
            ("unpaired Unicode surrogate rejected before hashing", () => Reject(Comment(text:"bad\ud800"),Context(),"INVALID_COMMENT_PAYLOAD")),
            ("wrong schema and nil request rejected", () => {
                Reject(new Proposal("wrong",ProposalKind.PackDraft,CaseA,1,PackKey,Pack().PackDraft),Context(),"INVALID_ENVELOPE");
                Reject(new Proposal(ProposalGuard.SchemaVersion,ProposalKind.PackDraft,CaseA,1,Guid.Empty,Pack().PackDraft),Context(),"INVALID_ENVELOPE");
            }),
            ("content revision fits proposed Dataverse Whole Number column", () => {
                Accept(Pack(revision:int.MaxValue),Context(revision:int.MaxValue));
                Reject(Pack(revision:(long)int.MaxValue+1),Context(),"INVALID_ENVELOPE");
                Reject(Pack(),Context(revision:(long)int.MaxValue+1),"STALE_CONTENT_REVISION");
            }),
            ("identifier and hash anchors reject trailing newline", () => {
                Reject(Pack(sections:new[]{new PackSection("scope\n","Title","Text",new[]{"S01"})}),Context(),"INVALID_PACK_SECTION");
                Reject(Pack(sections:new[]{Section(sources:new[]{"S01\n"})}),Context(),"INVALID_SOURCE_REFERENCE");
                Reject(Comment(hash:FileHash+"\n"),Context(),"INVALID_COMMENT_PAYLOAD");
            }),
            ("mixed payload kinds rejected", () => Reject(new Proposal(ProposalGuard.SchemaVersion,ProposalKind.PackDraft,CaseA,1,PackKey,Pack().PackDraft,Comment().InspectionComment),Context(),"INVALID_PACK_PAYLOAD")),
            ("unreferenced section requires owed owner", () => {
                Reject(Pack(sections:new[]{Section(sources:Array.Empty<string>())}),Context(),"INVALID_PACK_SECTION");
                Accept(Pack(sections:new[]{Section(sources:Array.Empty<string>(),owed:"Evidence owner owed")}));
            }),
            ("duplicate sections and source ids rejected", () => {
                Reject(Pack(sections:new[]{Section(),Section()}),Context(),"INVALID_PACK_SECTION");
                Reject(Pack(sections:new[]{Section(sources:new[]{"S01","S01"})}),Context(),"INVALID_SOURCE_REFERENCE");
            }),
            ("source shape and empty optional owner rejected", () => {
                Reject(Pack(sections:new[]{Section(sources:new[]{"https://unapproved.example"})}),Context(),"INVALID_SOURCE_REFERENCE");
                Reject(Pack(sections:new[]{Section(owed:"")}),Context(),"INVALID_PACK_SECTION");
            }),
            ("section count bounds enforced", () => {
                Reject(Pack(sections:Array.Empty<PackSection>()),Context(),"INVALID_PACK_PAYLOAD");
                Reject(Pack(sections:Enumerable.Range(0,13).Select(i=>new PackSection("section-"+i,"Title","Text",new[]{"S01"}))),Context(),"INVALID_PACK_PAYLOAD");
            }),
            ("canonical hash is deterministic and covers every binding", CanonicalCoverage),
            ("canonical encoding has no string delimiter ambiguity", () => {
                var a=Pack(sections:new[]{new PackSection("a","bc","d",new[]{"S01"})});
                var b=Pack(sections:new[]{new PackSection("a","b","cd",new[]{"S01"})});
                NotEqual(CanonicalProposal.Hash(a),CanonicalProposal.Hash(b));
            }),
            ("real PackDraft and InspectionComment fixture shapes map to core", () => {
                Accept(ReadFixture("pack-draft.json")); Accept(ReadFixture("inspection-comment.json"));
            }),
            ("versioned binary hash matches independently calculated fixture vectors", () => {
                Equal("e76cfc341e1585e9d5f9c8164cf1259fb39ba1bb420682e6e71aed883e0d4479",CanonicalProposal.Hash(ReadFixture("pack-draft.json")));
                Equal("6fa00dbb304dcb51a481b3db872cf7bd02f582132acd19d606a91dcde955b854",CanonicalProposal.Hash(ReadFixture("inspection-comment.json")));
            }),
            ("JSON object property ordering does not change semantic hash", () => {
                var original=File.ReadAllText(Path.Combine(AppContext.BaseDirectory,"fixtures","inspection-comment.json"));
                using var parsed=JsonDocument.Parse(original); var reversed=ReverseProperties(parsed.RootElement);
                Equal(CanonicalProposal.Hash(ReadFixtureText(original)),CanonicalProposal.Hash(ReadFixtureText(reversed)));
            })
        };
        var failed=0;
        foreach(var test in tests)
        {
            try { test.Run(); Console.WriteLine("PASS "+test.Name); }
            catch(Exception error) { failed++; Console.Error.WriteLine("FAIL "+test.Name+": "+error.Message); }
        }
        Console.WriteLine($"LOCAL CHECK: {tests.Count-failed}/{tests.Count} scenarios; {assertions} assertions. Tenant integration: NOT RUN.");
        return failed==0 ? 0 : 1;
    }

    private static void CanonicalCoverage()
    {
        var original=Pack(); var expected=CanonicalProposal.Hash(original); Equal(expected,CanonicalProposal.Hash(Pack()));
        var mutations=new[]{
            Pack(text:"different"),Pack(template:"template-2"),Pack(skill:"skill-2"),Pack(revision:2),Pack(requestKey:CommentKey),
            Pack(sections:new[]{new PackSection("other","Title","Synthetic evidence owed",new[]{"S01"})}),
            Pack(sections:new[]{new PackSection("scope","Other title","Synthetic evidence owed",new[]{"S01"})}),
            Pack(sections:new[]{Section(sources:new[]{"S02"})}),Pack(sections:new[]{Section(owed:"Another owner")})
        };
        foreach(var changed in mutations) NotEqual(expected,CanonicalProposal.Hash(changed));
        var comment=CanonicalProposal.Hash(Comment());
        NotEqual(comment,CanonicalProposal.Hash(Comment(text:"Different")));
        NotEqual(comment,CanonicalProposal.Hash(Comment(hash:new string('b',64))));
        NotEqual(comment,CanonicalProposal.Hash(Comment(artifactId:ArtifactB)));
        NotEqual(comment,CanonicalProposal.Hash(Comment(related:Related)));
        NotEqual(comment,CanonicalProposal.Hash(Comment(revision:2)));
    }
    private static Proposal Pack(string text="Synthetic evidence owed", string template="template-1", string skill="skill-1", long revision=1, Guid? requestKey=null, IEnumerable<PackSection>? sections=null)
        => new(ProposalGuard.SchemaVersion,ProposalKind.PackDraft,CaseA,revision,requestKey??PackKey,new PackDraftPayload(template,skill,sections??new[]{Section(text)}));
    private static PackSection Section(string text="Synthetic evidence owed", IEnumerable<string>? sources=null,string? owed=null)
        => new("scope","Title",text,sources??new[]{"S01"},owed);
    private static Proposal Comment(string text="Please identify the evidence owner.",string? hash=null, Guid? artifactId=null,Guid? related=null,Guid? requestKey=null,long revision=1)
        => new(ProposalGuard.SchemaVersion,ProposalKind.InspectionComment,CaseA,revision,requestKey??CommentKey,null,new InspectionCommentPayload(artifactId??ArtifactA,hash??FileHash,text,related));
    private static ArtifactSnapshot Artifact(Guid id,Guid caseId,long revision,bool current=true) => new(id,caseId,revision,FileHash,current);
    private static TrustedContext Context(bool canReadCase=true,bool canReadProposals=true,bool canPack=true,bool canComment=true,bool artifactAccess=true,bool sourceAccess=true,bool commentAccess=true,
        Guid? caseId=null,Guid? actor=null,long revision=1,ArtifactSnapshot? currentArtifact=null,bool withArtifact=true,RelatedCommentSnapshot? related=null,string rowVersion="42",long guardSequence=7)
        => new(actor??Actor,Writer,caseId??CaseA,revision,rowVersion,guardSequence,canReadCase,canReadProposals,canPack,canComment,
            sourceAccess?new[]{"S01","S02","S03","S04"}:Array.Empty<string>(),artifactAccess?new[]{ArtifactA,ArtifactB}:Array.Empty<Guid>(),
            commentAccess?new[]{Related}:Array.Empty<Guid>(),withArtifact?(currentArtifact??Artifact(ArtifactA,CaseA,revision)):null,related);
    private static CommittedReceipt Receipt(Proposal p,Guid? artifactId=null) => new(Guid.Parse("99999999-9999-4999-8999-999999999999"),p.CaseId,p.RequestKey,CanonicalProposal.Hash(p),"Historical committed result",artifactId);
    private static GuardDecision Accept(Proposal p,TrustedContext? c=null)
    { var d=ProposalGuard.Evaluate(p,c??Context(),new Lookup()); Equal(DecisionKind.AcceptPlan,d.Kind); if(d.Plan==null)throw new Exception("No plan: "+d.Code); return d; }
    private static void Reject(Proposal p,TrustedContext c,string code,CommittedReceipt? prior=null)
    { var d=ProposalGuard.Evaluate(p,c,new Lookup(prior)); Equal(DecisionKind.Reject,d.Kind); Equal(code,d.Code); Equal(null,d.Plan); Equal(null,d.Receipt); }
    private static void DeniedWithoutLookup(Proposal p,TrustedContext c,string code,CommittedReceipt? prior=null)
    { var lookup=new Lookup(prior); var d=ProposalGuard.Evaluate(p,c,lookup); Equal(DecisionKind.Reject,d.Kind); Equal(code,d.Code); Equal(0,lookup.Calls); Equal(null,d.Receipt); }
    private static void Equal<T>(T expected,T actual) { assertions++; if(!EqualityComparer<T>.Default.Equals(expected,actual))throw new Exception($"Expected {expected}; actual {actual}"); }
    private static void NotEqual<T>(T left,T right) { assertions++; if(EqualityComparer<T>.Default.Equals(left,right))throw new Exception("Expected distinct values"); }
    private static void Same(object expected,object actual) { assertions++; if(!ReferenceEquals(expected,actual))throw new Exception("Expected original receipt object"); }
    private sealed class Lookup : IReceiptLookup
    {
        private readonly CommittedReceipt? receipt;
        public int Calls {get;private set;}
        public Lookup(CommittedReceipt? receipt=null) { this.receipt=receipt; }
        public CommittedReceipt Find(Guid caseId,Guid requestKey) { Calls++; return receipt!; }
    }
    // Fixture mapping only. This is deliberately NOT a production wire decoder.
    // The separate contract validator rejects unknown properties and malformed wire values.
    private static Proposal ReadFixture(string name) => ReadFixtureText(File.ReadAllText(Path.Combine(AppContext.BaseDirectory,"fixtures",name)));
    private static Proposal ReadFixtureText(string json)
    {
        using var doc=JsonDocument.Parse(json);var r=doc.RootElement;var p=r.GetProperty("payload");
        var kind=r.GetProperty("kind").GetString();
        if(kind!="PackDraft" && kind!="InspectionComment") throw new InvalidDataException("Unsupported fixture kind");
        return new Proposal(r.GetProperty("schemaVersion").GetString()!,kind=="PackDraft"?ProposalKind.PackDraft:ProposalKind.InspectionComment,
            r.GetProperty("caseId").GetGuid(),r.GetProperty("expectedContentRevision").GetInt64(),r.GetProperty("requestKey").GetGuid(),
            kind=="PackDraft"?new PackDraftPayload(p.GetProperty("templateRelease").GetString()!,p.GetProperty("skillRelease").GetString()!,p.GetProperty("sections").EnumerateArray().Select(s=>new PackSection(
                s.GetProperty("key").GetString()!,s.GetProperty("title").GetString()!,s.GetProperty("text").GetString()!,s.GetProperty("sourceIds").EnumerateArray().Select(x=>x.GetString()!),s.TryGetProperty("owedOwner",out var owner)?owner.GetString():null))):null,
            kind=="InspectionComment"?new InspectionCommentPayload(p.GetProperty("artifactVersionId").GetGuid(),p.GetProperty("artifactHash").GetString()!,p.GetProperty("text").GetString()!,p.TryGetProperty("relatedCommentId",out var related)?related.GetGuid():null):null);
    }
    private static string ReverseProperties(JsonElement e)
    {
        using var ms=new MemoryStream();using(var writer=new Utf8JsonWriter(ms)){Reverse(writer,e);}return Encoding.UTF8.GetString(ms.ToArray());
    }
    private static void Reverse(Utf8JsonWriter writer,JsonElement e)
    {
        if(e.ValueKind==JsonValueKind.Object){writer.WriteStartObject();foreach(var p in e.EnumerateObject().Reverse()){writer.WritePropertyName(p.Name);Reverse(writer,p.Value);}writer.WriteEndObject();}
        else if(e.ValueKind==JsonValueKind.Array){writer.WriteStartArray();foreach(var item in e.EnumerateArray())Reverse(writer,item);writer.WriteEndArray();}
        else e.WriteTo(writer);
    }
}
