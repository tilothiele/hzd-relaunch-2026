# plugins/project_mail_override/lib/project_mail_override/hooks.rb

module ProjectMailOverride
  module Hooks
    class ProjectSettingsHook < Redmine::Hook::ViewListener
      render_on :view_projects_settings_tabs,
                partial: 'project_mail_settings/form'
    end
  end
end