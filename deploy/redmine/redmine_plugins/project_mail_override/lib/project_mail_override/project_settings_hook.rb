module ProjectMailOverride
  class ProjectSettingsHook < Redmine::Hook::ViewListener
    def view_projects_settings_tabs(context = {})
      Rails.logger.info "[ProjectMailOverride] Hook called"
      tabs = context[:tabs] ||= []
      tabs << {
        name: 'mail_override',
        label: 'Mail Override',
        partial: 'project_mail_settings/settings'
      }
      context[:tabs] = tabs
    end
  end
end