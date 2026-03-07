# plugins/project_mail_override/init.rb

puts "--- [ProjectMailOverride] init.rb loaded ---"
Rails.logger.info "[ProjectMailOverride] init.rb is being loaded"

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

Rails.application.config.to_prepare do
  puts "--- [ProjectMailOverride] to_prepare running ---"
  Rails.logger.info "[ProjectMailOverride] configured plugin and hooks begin"

  require "project_mail_override/mailer_patch"
  require "project_mail_override/hooks/project_settings_hook"
  # Ensure the hook is initialized
  ProjectMailOverride::Hooks::ProjectSettingsHook.instance

  Rails.logger.info "[ProjectMailOverride] configured plugin and hooks end"

end