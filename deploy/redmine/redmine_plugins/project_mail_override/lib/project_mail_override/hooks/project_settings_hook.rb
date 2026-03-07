module ProjectMailOverride
  module Hooks
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
        puts "--- [ProjectMailOverride] hook triggered (method: add_tab) ---"
        project = context[:project]
        
        unless project
          puts "--- [ProjectMailOverride] No project in context! ---"
          return
        end

        enabled = project.module_enabled?(:project_mail_override)
        puts "--- [ProjectMailOverride] Project: #{project.identifier}, Module Enabled: #{enabled} ---"
        
        return unless enabled
        
        puts "--- [ProjectMailOverride] Adding settings tab ---"

        tabs = context[:tabs]
        return unless tabs

        tabs << {
          name: 'mail_override',
          label: 'Mail Override',
          partial: 'project_mail_settings/settings'
        }
      end
    end
  end
end