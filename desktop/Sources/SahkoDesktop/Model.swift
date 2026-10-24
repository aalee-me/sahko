import AppKit
import Combine
import CoreGraphics
import Foundation
import SahkoCore

@MainActor final class AppModel: ObservableObject {
 @Published var monitoring=false
 @Published var browserContext=false
 @Published var spotifyContext=false
 @Published var youtubeAudio=false
 @Published var shareVibe=false
 @Published var readingMode=false
 @Published var currentApp="Monitoring is off"
 @Published var lastExternalApp=""
 @Published var result=Classification(.focused,"Enable local monitoring to begin")
 @Published var policy=Policy()
 @Published var pairCode=""
 @Published var pairStatus="Not paired"
 @Published var pairingBusy=false
 @Published var snapshot=SharedSnapshot()
 @Published var pinned=UserDefaults.standard.object(forKey:"panelPinned") as? Bool ?? true
 @Published var autoFloat=UserDefaults.standard.object(forKey:"autoFloat") as? Bool ?? true
 @Published var sessionActive=false
 @Published var nudge=false
 var credentials:PairCredentials?
 var onSnapshot:((SharedSnapshot,Bool)->Void)?
 var onJolt:((String)->Void)?
 var onShowPanel:(()->Void)?
 var onDisplayChange:((Bool)->Void)?
 private var classifier=Classifier(),ticker:Timer?,probeBusy=false,publishBusy=false,host:String?,spotifyPlaying=false,musicPlaying=false
 private var observedBundle="",lastProbe=Date.distantPast,lastPublish=Date.distantPast,lastJolt:String?,ack:String?
 init(){if let data=UserDefaults.standard.data(forKey:"policy"),let saved=try? JSONDecoder().decode(Policy.self,from:data){policy=saved};credentials=PairKeychain.load();if credentials != nil {pairStatus="Phone pairing saved"};ticker=Timer.scheduledTimer(timeInterval:1,target:self,selector:#selector(timerTick(_:)),userInfo:nil,repeats:true)}
 @objc private func timerTick(_ timer:Timer){tick()}
 func saveDisplayPreferences(){UserDefaults.standard.set(pinned,forKey:"panelPinned");UserDefaults.standard.set(autoFloat,forKey:"autoFloat");onDisplayChange?(pinned)}
 func classifyCurrentApp(as bucket:String){guard monitoring,!lastExternalApp.isEmpty else{return};let app=lastExternalApp;policy.deepWork.removeAll{$0.caseInsensitiveCompare(app) == .orderedSame};policy.neutral.removeAll{$0.caseInsensitiveCompare(app) == .orderedSame};policy.distracting.removeAll{$0.caseInsensitiveCompare(app) == .orderedSame};switch bucket{case "deep":policy.deepWork.append(app);case "distracting":policy.distracting.append(app);default:policy.neutral.append(app)};savePolicy();classifier.reset();tick()}
 func savePolicy(){if let data=try? JSONEncoder().encode(policy){UserDefaults.standard.set(data,forKey:"policy")}}
 func setMonitoring(_ value:Bool){monitoring=value;classifier.reset();host=nil;result=Classification(.focused,value ? "Local monitoring enabled" : "Monitoring is off");if(!value){currentApp="Monitoring is off"};tick()}
 func markBack(){classifier.reset();result=Classification(.focused,"You checked back in");snapshot.state = .focused;onSnapshot?(snapshot,monitoring)}
 func tick(){
  if monitoring {
   let front=NSWorkspace.shared.frontmostApplication,app=front?.localizedName ?? "Unknown",bundle=front?.bundleIdentifier ?? ""
   currentApp=app
   if bundle != Bundle.main.bundleIdentifier {lastExternalApp=app}
   if bundle != observedBundle {host=nil;observedBundle=bundle}
   if !probeBusy && Date().timeIntervalSince(lastProbe)>=3 && (browserContext || spotifyContext) {
    probeBusy=true;lastProbe=Date();let browser=browserContext,music=spotifyContext
    DispatchQueue.global(qos:.utility).async{let nextHost=browser ? BrowserProbe.host(bundleID:bundle):nil,nextMusic=music && BrowserProbe.spotifyPlaying(),nextAppleMusic=music && BrowserProbe.appleMusicPlaying();Task{@MainActor in if self.observedBundle==bundle {self.host=nextHost};self.spotifyPlaying=nextMusic;self.musicPlaying=nextAppleMusic;self.probeBusy=false}}
   }
   var selected=policy;if readingMode {selected.idleSeconds=max(selected.idleSeconds,900)}
   let audio=(bundle=="com.spotify.client" && spotifyPlaying)||(bundle=="com.apple.Music" && musicPlaying)||(youtubeAudio && (host=="youtube.com" || host?.hasSuffix(".youtube.com")==true))
   let observation=Observation(app:app,host:browserContext ? host:nil,idle:CGEventSource.secondsSinceLastEventType(.combinedSessionState,eventType:.null),audioContext:audio,onBreak:snapshot.onBreak)
   result=classifier.classify(observation,policy:selected,now:Date().timeIntervalSince1970)
   snapshot.state=result.state;snapshot.vibe=shareVibe ? result.vibe:nil
   for i in snapshot.members.indices where snapshot.members[i].isSelf {snapshot.members[i].state=result.state}
  } else {snapshot.vibe=nil}
  onSnapshot?(snapshot,monitoring)
  if credentials != nil && !publishBusy && Date().timeIntervalSince(lastPublish)>=3 {publishBusy=true;lastPublish=Date();Task{await publish()}}
 }
 func acceptRoom(_ data:Data,active:Bool=false){guard let incoming=try? JSONDecoder().decode(SharedSnapshot.self,from:data),incoming.members.count<=8 else{return};snapshot=incoming;sessionActive=active;if monitoring {snapshot.state=result.state;snapshot.vibe=shareVibe ? result.vibe:nil;for i in snapshot.members.indices where snapshot.members[i].isSelf {snapshot.members[i].state=result.state}}}
 func pair(){guard !pairingBusy else{return};pairingBusy=true;Task{do{if let saved=credentials {pairCode=try await PairService.code(saved)}else{let made=try await PairService.create();let c=PairCredentials(id:made.id,writerToken:made.writerToken);credentials=c;PairKeychain.save(c);pairCode=made.joinCode};pairStatus="Enter this code on your phone within 10 minutes";lastPublish = .distantPast;await publish()}catch{pairStatus=error.localizedDescription};pairingBusy=false}}
 func disconnect(){guard let c=credentials else{return};Task{do{try await PairService.revoke(c);credentials=nil;pairCode="";PairKeychain.save(nil);pairStatus="Phone access revoked"}catch{pairStatus="Couldn’t revoke while offline. Try again when connected."}}}
 private func publish() async {defer{publishBusy=false};guard let c=credentials else{return};do{try await PairService.publish(c,snapshot:snapshot,ack:ack);ack=nil;let response=try await PairService.read(c);if let jolt=response.jolt,jolt.id != lastJolt,Date().timeIntervalSince1970-jolt.at/1000<30{lastJolt=jolt.id;ack=jolt.id;onJolt?(jolt.target);onShowPanel?();nudge=true;DispatchQueue.main.asyncAfter(deadline:.now()+1.5){self.nudge=false}};if pairCode.isEmpty {pairStatus="Phone link connected"}}catch{pairStatus=error.localizedDescription}}
 var timeLabel:String {String(format:"%d:%02d",snapshot.remaining/60,snapshot.remaining%60)}
}
