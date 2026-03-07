# plugins/project_mail_override/lib/project_mail_override/hooks/project_settings_hook.rb
module ProjectMailOverride
  module Hooks
    class ProjectSettingsHook < Redmine::Hook::ViewListener
      def view_projects_settings_tabs(context = {})
        puts "--- [ProjectMailOverride] view_projects_settings_tabs hook called ---"
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
end