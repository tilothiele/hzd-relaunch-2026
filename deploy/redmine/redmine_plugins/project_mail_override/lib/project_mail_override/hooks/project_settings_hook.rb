module ProjectMailOverride
  module Hooks
    class ProjectSettingsHook < Redmine::Hook::ViewListener
      def view_projects_settings_tabs(context = {})
        Rails.logger.info "[ProjectMailOverride] Hook view_projects_settings_tabs called"

        tabs = context[:tabs] ||= []
        Rails.logger.info "[ProjectMailOverride] Current tabs before adding: #{tabs.map { |t| t[:name] }}"

        tabs << {
          name: 'mail_override',
          label: 'Mail Override',
          action: :manage_project_mail_settings,
          partial: 'project_mail_settings/settings'
        }

        Rails.logger.info "[ProjectMailOverride] Tab added: #{tabs.map { |t| t[:name] }}"

        context[:tabs] = tabs
      end
    end
  end
end