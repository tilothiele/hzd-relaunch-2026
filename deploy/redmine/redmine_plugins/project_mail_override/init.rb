# plugins/project_mail_override/init.rb

puts "--- [ProjectMailOverride] init.rb loaded ---"
Rails.logger.info "[ProjectMailOverride] init.rb is being loaded"
puts "--- [ProjectMailOverride] Rails.application.initialized? = #{Rails.application.initialized?}"
puts "--- [ProjectMailOverride] Rails.env = #{Rails.env}"

Redmine::Plugin.register :project_mail_override do
  name 'Project Mail Override'
  author '<Tilo Thiele> t.thiele@hovawarte.com'
  description 'Override From and Reply-To per project'
  version '0.0.1'
  requires_redmine version_or_higher: '6.0.0'

  project_module :project_mail_override do
    permission :manage_project_mail_settings,
               { project_mail_settings: [:edit, :update] },
               require: :member
  end
end
# Add lib to load path
lib_dir = File.join(File.dirname(__FILE__), 'lib')
$LOAD_PATH.unshift(lib_dir) unless $LOAD_PATH.include?(lib_dir)

def apply_patches
  return if @patches_applied
  puts "--- [ProjectMailOverride] applying patches ---"
  Rails.logger.info "[ProjectMailOverride] configured plugin and hooks begin"

  require "project_mail_override/mailer_patch"
  require "project_mail_override/hooks/project_settings_hook"

  # Ensure the hook is initialized
  ProjectMailOverride::Hooks::ProjectSettingsHook.instance

  Rails.logger.info "[ProjectMailOverride] configured plugin and hooks end"
  @patches_applied = true
end

if Rails.application.initialized?
  apply_patches
else
  Rails.application.config.to_prepare do
    apply_patches
  end

  # Fallback for some environments
  Rails.application.config.after_initialize do
    apply_patches
  end
end
