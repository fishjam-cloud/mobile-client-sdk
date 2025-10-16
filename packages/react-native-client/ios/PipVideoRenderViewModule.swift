import ExpoModulesCore

public class PipVideoRenderViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("PipVideoRenderViewModule")

        View(PipVideoRenderView.self) {
            
        }
    }
}
