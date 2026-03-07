module ProjectMailOverride
  module Hooks
    class ProjectSettingsHook < Redmine::Hook::ViewListener
      def view_projects_settings_tabs(context = {})
        # Sicherstellen, dass tabs existiert
        tabs = context[:tabs] ||= []

        # Neuen Tab hinzufügen
        tabs << {
          name: 'mail_override',                               # interne ID des Tabs
          label: 'Mail Override',                              # Beschriftung im UI
          action: :manage_project_mail_settings,              # Permission-Name
          partial: 'project_mail_settings/settings'           # Partial, das gerendert wird
        }      end
    end
  end
end