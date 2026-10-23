import AppKit
import SwiftUI
import WebKit
import SahkoCore

final class FloatingPanel:NSPanel {override var canBecomeKey:Bool {true}}
@MainActor final class AppDelegate:NSObject,NSApplicationDelegate,WKScriptMessageHandler,WKNavigationDelegate {
 let model=AppModel()
 var status:NSStatusItem!,panel:FloatingPanel!,webWindow:NSWindow!,settingsWindow:NSWindow!,web:WKWebView!
 func applicationDidFinishLaunching(_ note:Notification){
  NSApp.setActivationPolicy(.accessory)
  status=NSStatusBar.system.statusItem(withLength:NSStatusItem.variableLength);status.button?.title="ö";status.button?.font=NSFont.systemFont(ofSize:23,weight:.bold);status.button?.contentTintColor=NSColor.systemYellow;status.button?.target=self;status.button?.action=#selector(togglePanel);status.button?.sendAction(on:[.leftMouseUp,.rightMouseUp])
  let config=WKWebViewConfiguration();config.userContentController.add(self,name:"sahkoDesktop");config.userContentController.addUserScript(WKUserScript(source:"window.sahkoNativeAvailable=true;",injectionTime:.atDocumentStart,forMainFrameOnly:true));web=WKWebView(frame:.zero,configuration:config);web.navigationDelegate=self
  webWindow=NSWindow(contentRect:NSRect(x:0,y:0,width:1160,height:820),styleMask:[.titled,.closable,.miniaturizable,.resizable],backing:.buffered,defer:false);webWindow.isReleasedWhenClosed=false;webWindow.title="Sähkö";webWindow.contentView=web;webWindow.center();web.load(URLRequest(url:URL(string:"https://aalee-me.github.io/sahko/?desktop=1")!))
  panel=FloatingPanel(contentRect:NSRect(x:0,y:0,width:330,height:216),styleMask:[.borderless,.nonactivatingPanel],backing:.buffered,defer:false);panel.isOpaque=false;panel.backgroundColor = .clear;panel.hasShadow=true;panel.isMovableByWindowBackground=true;panel.level = .floating;panel.collectionBehavior=[.canJoinAllSpaces,.fullScreenAuxiliary];panel.contentView=NSHostingView(rootView:PanelView(model:model,open:{[weak self] in self?.openWeb()},preferences:{[weak self] in self?.showSettings()},pin:{[weak self] in guard let self=self else{return};self.model.pinned.toggle();self.panel.level=self.model.pinned ? .floating:.normal}))
  if let screen=NSScreen.main {panel.setFrameOrigin(NSPoint(x:screen.visibleFrame.midX-165,y:screen.visibleFrame.maxY-235))};panel.orderFrontRegardless()
  settingsWindow=NSWindow(contentRect:NSRect(x:0,y:0,width:540,height:720),styleMask:[.titled,.closable,.resizable],backing:.buffered,defer:false);settingsWindow.isReleasedWhenClosed=false;settingsWindow.title="Sähkö · Local privacy & focus";settingsWindow.contentView=NSHostingView(rootView:PreferencesView(model:model));settingsWindow.center()
  model.onSnapshot={[weak self] snapshot,monitoring in guard let self=self,let data=try? JSONEncoder().encode(snapshot),let json=String(data:data,encoding:.utf8) else{return};self.status.button?.toolTip=monitoring ? snapshot.state.rawValue.capitalized:"Monitoring off";self.web.evaluateJavaScript("window.sahkoNativeState?.({snapshot:"+json+",monitoring:"+(monitoring ? "true":"false")+"})",completionHandler:nil)}
  model.onJolt={[weak self] target in guard let data=try? JSONEncoder().encode(target),let json=String(data:data,encoding:.utf8) else{return};self?.web.evaluateJavaScript("window.sahkoNativeJolt?.("+json+")",completionHandler:nil)}
  model.onShowPanel={[weak self] in self?.panel.orderFrontRegardless()}
  if !UserDefaults.standard.bool(forKey:"introSeen"){showSettings();UserDefaults.standard.set(true,forKey:"introSeen")}
 }
 @objc func togglePanel(){if NSApp.currentEvent?.type == .rightMouseUp,let button=status.button{let menu=NSMenu();let open=menu.addItem(withTitle:"Open session",action:#selector(openAction),keyEquivalent:"");open.target=self;let preferences=menu.addItem(withTitle:"Settings…",action:#selector(settingsAction),keyEquivalent:"");preferences.target=self;menu.addItem(.separator());let quit=menu.addItem(withTitle:"Quit Sähkö",action:#selector(NSApplication.terminate(_:)),keyEquivalent:"q");quit.target=NSApp;menu.popUp(positioning:nil,at:NSPoint(x:0,y:button.bounds.height),in:button);return};if panel.isVisible {panel.orderOut(nil)}else{panel.orderFrontRegardless()}}
 @objc func openAction(){openWeb()}
 @objc func settingsAction(){showSettings()}
 func openWeb(){webWindow.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)}
 func showSettings(){settingsWindow.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)}
 func webView(_ webView:WKWebView,didFinish navigation:WKNavigation!){model.tick()}
 func userContentController(_ userContentController:WKUserContentController,didReceive message:WKScriptMessage){guard message.frameInfo.isMainFrame,message.frameInfo.securityOrigin.host=="aalee-me.github.io",let body=message.body as? [String:Any],let kind=body["kind"] as? String else{return};if kind=="room",let raw=body["snapshot"],let data=try? JSONSerialization.data(withJSONObject:raw){model.acceptRoom(data)};if kind=="jolt"{model.nudge=true;panel.orderFrontRegardless();DispatchQueue.main.asyncAfter(deadline:.now()+1.5){self.model.nudge=false}};if kind=="settings"{showSettings()};if kind=="panel"{panel.orderFrontRegardless()}}
 func applicationShouldTerminateAfterLastWindowClosed(_ sender:NSApplication)->Bool {false}
}
@main struct SahkoApplication {
 @MainActor static func main(){let app=NSApplication.shared;let delegate=AppDelegate();app.delegate=delegate;app.run()}
}
