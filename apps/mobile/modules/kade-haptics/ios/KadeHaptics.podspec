Pod::Spec.new do |s|
  s.name           = 'KadeHaptics'
  s.version        = '0.1.0'
  s.summary        = 'Impact haptics for Kadé Commerce add-to-cart'
  s.description    = 'Wraps UIImpactFeedbackGenerator behind the Expo Modules API. iOS only; the JS entry point falls back to a no-op on other platforms.'
  s.author         = 'Kadé Commerce course'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
