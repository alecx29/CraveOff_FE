Pod::Spec.new do |s|
  s.name         = 'CraveOffProtection'
  s.version      = '1.0.0'
  s.summary      = 'CraveOff Family Controls native module.'
  s.description  = 'Bridges FamilyControls/ManagedSettings to React Native.'
  s.homepage     = 'https://craveoff.app'
  s.license      = { :type => 'Proprietary' }
  s.authors      = { 'CraveOff' => 'support@craveoff.app' }
  s.platform     = :ios, '16.0'
  s.source       = { :path => '.' }
  s.source_files = 'CraveOffProtectionModule.{m,swift}'
  s.swift_versions = ['5.0']
  s.requires_arc = true
  s.frameworks   = ['FamilyControls', 'ManagedSettings']
  s.dependency 'React-Core'
end

