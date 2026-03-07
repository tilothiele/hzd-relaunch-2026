module ProjectMailOverride
  module Hooks
    class ProjectSettingsHook < Redmine::Hook::ViewListener
      def view_projects_settings_tabs(context = {})
        context[:tabs] << {
          name: 'mail_override',
          label: 'Mail Override',
          action: :manage_project_mail_settings,
          partial: 'project_mail_settings/settings'
        }
      end
    end
  end
end