import AppKit
import SwiftUI
import SahkoCore

let amber=Color(red:0.98,green:0.73,blue:0.16)
struct LobeView:View {
 var drifting:Bool
 @Environment(\.accessibilityReduceMotion) private var reduced
 var body:some View {TimelineView(.animation(minimumInterval:1/24,paused:reduced)){timeline in Canvas{context,size in let t=reduced ? 0:timeline.date.timeIntervalSinceReferenceDate;for i in 0..<500 {let a=Double(i)*2.399963+t*(drifting ? 0.25:0.06),r=sqrt(Double(i)/500)*42,x=size.width/2+cos(a)*r*(1+0.18*sin(a*3+t)),y=size.height/2+sin(a)*r*0.55;let dot=CGRect(x:x,y:y,width:i%7==0 ? 2:1,height:i%7==0 ? 2:1);context.fill(Path(ellipseIn:dot),with:.color((i%4==0 ? amber:Color.purple.opacity(0.6)).opacity(0.45+Double(i%5)*0.1)))}}}.frame(width:110,height:82)}
}
struct PanelView:View {
 @ObservedObject var model:AppModel
 var open:()->Void;var preferences:()->Void;var pin:()->Void
 var body:some View {VStack(spacing:12){HStack{Text("ö").font(.system(size:25,weight:.bold));Text("Sähkö").font(.system(size:14,weight:.medium));Spacer();Button(action:pin){Image(systemName:model.pinned ? "pin.fill":"pin")}.help("Keep above other windows");Button(action:preferences){Image(systemName:"slider.horizontal.3")}.help("Settings");Button(action:open){Image(systemName:"arrow.up.right")}.help("Open your session")}.buttonStyle(.plain)
 HStack(alignment:.center){VStack(alignment:.leading,spacing:6){Text(model.timeLabel).foregroundColor(model.snapshot.onBreak ? amber:Color(red:0.95,green:0.93,blue:0.88)).font(.system(size:32,weight:.medium,design:.rounded).monospacedDigit());Text(model.monitoring ? model.result.state.rawValue.capitalized:"Monitoring off").font(.system(size:12)).foregroundColor(model.monitoring ? amber:.secondary);Text(model.snapshot.roomTitle).font(.system(size:11)).foregroundColor(.secondary).lineLimit(1)};Spacer();LobeView(drifting:model.monitoring && model.result.state == .drifting)}
 ProgressView(value:model.snapshot.progress).tint(amber)
 if model.monitoring && model.result.state == .drifting {Button("I’m back",action:model.markBack).buttonStyle(.bordered).tint(amber)}
 }.padding(18).frame(width:330).background(Color(red:0.055,green:0.055,blue:0.05)).foregroundColor(Color(red:0.95,green:0.93,blue:0.88)).clipShape(RoundedRectangle(cornerRadius:22)).overlay(RoundedRectangle(cornerRadius:22).stroke(amber.opacity(model.nudge ? 1:0.2),lineWidth:model.nudge ? 2:1)).scaleEffect(model.nudge ? 1.025:1).animation(.easeInOut(duration:0.25),value:model.nudge)}
}
struct PreferencesView:View {
 @ObservedObject var model:AppModel
 private func binding(_ key:WritableKeyPath<Policy,[String]>)->Binding<String>{Binding(get:{model.policy[keyPath:key].joined(separator:", ")},set:{model.policy[keyPath:key]=$0.split(separator:",").map{$0.trimmingCharacters(in:.whitespacesAndNewlines)}.filter{!$0.isEmpty};model.savePolicy()})}
 var body:some View {ScrollView{VStack(alignment:.leading,spacing:18){Text("Your focus, your rules.").font(.system(size:26,weight:.medium));Text("All classification happens on this Mac. No screenshots, window titles, browsing history, keystrokes or raw app names are uploaded.").font(.system(size:13)).foregroundColor(.secondary)
 Toggle("Enable local activity monitoring",isOn:Binding(get:{model.monitoring},set:{model.setMonitoring($0)}));Text("Reads only the foreground app and time since input. Reading mode allows longer quiet work; it never records what you type.").font(.caption).foregroundColor(.secondary)
 if model.monitoring {Menu("Classify current app"){Button("Deep work"){model.classifyCurrentApp(as:"deep")};Button("Neutral / reference"){model.classifyCurrentApp(as:"neutral")};Button("Distracting"){model.classifyCurrentApp(as:"distracting")}};Text("On this Mac: \(model.currentApp)\n\(model.result.reason)").font(.system(size:12)).padding(12).frame(maxWidth:.infinity,alignment:.leading).background(Color.secondary.opacity(0.08)).cornerRadius(12)}
 Divider();Text("Floating panel").font(.headline)
 Toggle("Keep compact panel above other apps",isOn:$model.pinned).onChange(of:model.pinned){_ in model.saveDisplayPreferences()}
 Toggle("Show panel when I switch apps during a session",isOn:$model.autoFloat).onChange(of:model.autoFloat){_ in model.saveDisplayPreferences()}
 Text("Follows Spaces and remains visible while other apps are active. Drag it to position it anywhere.").font(.caption).foregroundColor(.secondary)
 Divider();Text("App buckets").font(.headline);bucket("Deep work",binding(\.deepWork));bucket("Neutral / reference",binding(\.neutral));bucket("Distracting",binding(\.distracting));bucket("Off-task domains",binding(\.offTaskHosts));Text("App names and domains are exact local rules. Brief switches are fine. Off-task contexts drift after 90 continuous seconds; neutral references get a two-minute grace period.").font(.caption).foregroundColor(.secondary)
 Toggle("Browser context (Safari, Chrome and Arc)",isOn:$model.browserContext);Text("Optional macOS Automation permission. Reads the active tab URL only to extract its domain locally; URLs and page titles are never shared. Without this permission browsers stay neutral.").font(.caption).foregroundColor(.secondary)
 Toggle("Detect Spotify / Music playback",isOn:$model.spotifyContext);Text("Optional Automation permission. A playing Spotify or Music window is exempt; music playing in the background never excuses an off-task website.").font(.caption).foregroundColor(.secondary)
 Toggle("I’m using YouTube for music or a lecture",isOn:$model.youtubeAudio);Text("Manual YouTube exemption because macOS does not expose a reliable public API for every browser’s audio. Applies only to YouTube while browser context is enabled; inactivity still counts.").font(.caption).foregroundColor(.secondary)
 Toggle("Reading / quiet work mode (15-minute check-in)",isOn:$model.readingMode);Stepper("Idle check-in: \(Int(model.policy.idleSeconds/60)) minutes",value:$model.policy.idleSeconds,in:60...1800,step:60).onChange(of:model.policy.idleSeconds){_ in model.savePolicy()}
 Toggle("Share an optional broad activity tag",isOn:$model.shareVibe);Text("Only approved labels such as Figma, VS Code, Reading or Now Playing. No distracting app or URL is named to friends. Song titles are not collected.").font(.caption).foregroundColor(.secondary)
 Divider();Text("Pair your phone over the internet").font(.headline);Text("Open Sähkö on your phone → Pair desktop, then enter the code below. Pairing shares only the processed state, chosen broad tag, timer and room display information. The desktop must stay awake and online.").font(.system(size:13)).foregroundColor(.secondary)
 HStack{Button(model.credentials == nil ? "Create pairing code":"New pairing code",action:model.pair).disabled(model.pairingBusy);if model.credentials != nil {Button("Revoke phone access",action:model.disconnect)}}
 if !model.pairCode.isEmpty {HStack{Text(model.pairCode).font(.system(size:25,weight:.medium,design:.monospaced));Button("Copy"){NSPasteboard.general.clearContents();NSPasteboard.general.setString(model.pairCode,forType:.string)}};Link("Open phone pairing page",destination:URL(string:"https://aalee-me.github.io/sahko/?pair="+model.pairCode)!)}
 Text(model.pairStatus).font(.caption).foregroundColor(.secondary);Text("Monitoring and browser/audio permissions start off on every launch. You can stop monitoring or revoke pairing at any time.").font(.caption).foregroundColor(.secondary)
 }.padding(26)}}
 private func bucket(_ label:String,_ text:Binding<String>)->some View{VStack(alignment:.leading,spacing:5){Text(label).font(.system(size:13,weight:.medium));TextField("Comma-separated app names",text:text).textFieldStyle(.roundedBorder)}}
}
