import ExpoModulesCore
import UIKit

// Skeleton prepared by W1-mobile on Linux; compiled and verified on the iOS Simulator by the W4-13 macOS child.
public class KadeHapticsModule: Module {
  private var generators: [String: UIImpactFeedbackGenerator] = [:]

  public func definition() -> ModuleDefinition {
    Name("KadeHaptics")

    Constant("isAvailable") { true }

    // Fire one impact. `style` is "light" | "medium" | "heavy" | "soft" | "rigid".
    AsyncFunction("impact") { (style: String) -> Bool in
      let generator = self.generator(for: style)
      generator.prepare()
      generator.impactOccurred()
      return true
    }.runOnQueue(.main)
  }

  private func generator(for style: String) -> UIImpactFeedbackGenerator {
    if let cached = generators[style] {
      return cached
    }
    let feedbackStyle: UIImpactFeedbackGenerator.FeedbackStyle
    switch style {
    case "light": feedbackStyle = .light
    case "heavy": feedbackStyle = .heavy
    case "soft": feedbackStyle = .soft
    case "rigid": feedbackStyle = .rigid
    default: feedbackStyle = .medium
    }
    let generator = UIImpactFeedbackGenerator(style: feedbackStyle)
    generators[style] = generator
    return generator
  }
}
