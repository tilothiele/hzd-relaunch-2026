module ProjectMailOverride
  module Hooks
    puts "--- [ProjectMailOverride] ProjectSettingsHook file loading ---"
    class ProjectSettingsHook < Redmine::Hook::ViewListener
      def self.instance
        @instance ||= new
      end

      # Try both hook names for Redmine 5/6 compatibility
      def view_projects_settings_tabs(context = {})
        add_tab(context)
      end

      def helper_projects_settings_tabs(context = {})
        add_tab(context)
      end

      private

      def add_tab(context)
        project = context[:project]
        return unless project && project.module_enabled?(:project_mail_override)

        tabs = context[:tabs]
        return unless tabs

        tabs << {
          name: 'mail_override',
          label: :label_mail_override,
          partial: 'project_mail_settings/settings'
        }
      end
    end
  end
end