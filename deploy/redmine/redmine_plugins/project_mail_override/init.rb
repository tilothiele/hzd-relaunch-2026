# plugins/project_mail_override/init.rb

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
  
  begin
    puts "--- [ProjectMailOverride] Loading hooks ---"
    require "project_mail_override/hooks/project_settings_hook"
    require "project_mail_override/hooks/issue_hook"
    # Registration as CLASS for Redmine
    Redmine::Hook.add_listener(ProjectMailOverride::Hooks::ProjectSettingsHook)
    Redmine::Hook.add_listener(ProjectMailOverride::Hooks::IssueHook)
    puts "--- [ProjectMailOverride] Hooks registered (class) ---"
  rescue => e
    puts "--- [ProjectMailOverride] Error loading hook: #{e.message} ---"
    puts e.backtrace.first(5).join("\n")
    Rails.logger.error "[ProjectMailOverride] Error loading hook: #{e.message}"
  end

  begin
    require "project_mail_override/patches/project_patch"
    require "project_mail_override/patches/mailer_patch"
    require "project_mail_override/patches/projects_helper_patch"
  rescue => e
    Rails.logger.error "[ProjectMailOverride] Error loading patches: #{e.message}"
  end

  @project_mail_override_patches_applied = true
end

# Run initialization in two possible spots to ensure it fires in any environment
Rails.application.config.to_prepare do
  apply_project_mail_override_patches
end

# Fallback for some production server configurations
ActiveSupport.on_load(:after_initialize) do
  apply_project_mail_override_patches
end
