# plugins/project_mail_override/init.rb

puts "--- [ProjectMailOverride] init.rb evaluation start ---"

Redmine::Plugin.register :project_mail_override do
  name 'Project Mail Override'
  author '<Tilo Thiele> t.thiele@hovawarte.com'
  description 'Override From and Reply-To per project'
  version '0.0.1'
  requires_redmine version_or_higher: '5.0.0'
  
  project_module :project_mail_override do
    permission :manage_project_mail_settings,
               { project_mail_settings: [:edit, :update] },
               require: :member
  end
end

# Add lib to load path
lib_dir = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib_dir) unless $LOAD_PATH.include?(lib_dir)

# Define initialization logic
def apply_project_mail_override_patches
  return if @project_mail_override_patches_applied
  puts "--- [ProjectMailOverride] apply_project_mail_override_patches start ---"
  
  begin
    require "project_mail_override/hooks/project_settings_hook"
    # Explicit registration for Redmine 6
    Redmine::Hook.add_listener(ProjectMailOverride::Hooks::ProjectSettingsHook)
    puts "--- [ProjectMailOverride] Hook registered ---"
  rescue LoadError => e
    puts "--- [ProjectMailOverride] Error loading hook: #{e.message} ---"
  rescue => e
    puts "--- [ProjectMailOverride] Unexpected error loading hook: #{e.message} ---"
  end

  begin
    require "project_mail_override/patches/project_patch"
    require "project_mail_override/patches/mailer_patch"
    puts "--- [ProjectMailOverride] Patches required ---"
  rescue LoadError => e
    puts "--- [ProjectMailOverride] Error loading patches: #{e.message} ---"
  rescue => e
    puts "--- [ProjectMailOverride] Unexpected error loading patches: #{e.message} ---"
  end

  @project_mail_override_patches_applied = true
  puts "--- [ProjectMailOverride] apply_project_mail_override_patches end ---"
end

# Run initialization in two possible spots to ensure it fires in any environment
Rails.application.config.to_prepare do
  apply_project_mail_override_patches
end

# Fallback for some production server configurations
ActiveSupport.on_load(:after_initialize) do
  apply_project_mail_override_patches
end

puts "--- [ProjectMailOverride] init.rb evaluation end ---"
