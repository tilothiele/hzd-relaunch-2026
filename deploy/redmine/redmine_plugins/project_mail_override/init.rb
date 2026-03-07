# plugins/project_mail_override/init.rb

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

Rails.configuration.to_prepare do
  require_dependency 'project'

  Project.class_eval do
    has_one :project_mail_setting, dependent: :destroy
  end

  require_dependency 'project_mail_override/hooks/project_settings_hook'
  ProjectMailOverride::Hooks::ProjectSettingsHook.new
end