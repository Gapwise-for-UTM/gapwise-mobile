Pod::Spec.new do |s|
  s.name           = 'GapwiseDeviceCrypto'
  s.version        = '0.1.0'
  s.summary        = 'Gapwise non-exportable device cryptography'
  s.description    = 'Native RSA-OAEP and AES-GCM operations for Gapwise encrypted account continuity.'
  s.author         = 'Gapwise'
  s.homepage       = 'https://github.com/andrewmuratov/gapwise-mobile'
  s.platforms      = { :ios => '16.4' }
  s.source         = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_VERSION' => '5.9'
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
