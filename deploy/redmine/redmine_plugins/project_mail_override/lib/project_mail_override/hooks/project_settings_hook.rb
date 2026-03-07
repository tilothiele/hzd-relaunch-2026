# plugins/project_mail_override/lib/project_mail_override/hooks/project_settings_hook.rb
puts "--- [ProjectMailOverride] ProjectSettingsHook file loading ---"

module ProjectMailOverride
  module Hooks
    class ProjectSettingsHook < Redmine::Hook::ViewListener
      puts "--- [ProjectMailOverride] ProjectSettingsHook class defined ---"
      
      def view_projects_settings_tabs(context = {})
        puts "--- [ProjectMailOverride] view_projects_settings_tabs hook triggered ---"
        project = context[:project]
        
        unless project
          puts "--- [ProjectMailOverride] No project in context! ---"
          return
        end

        enabled = project.module_enabled?(:project_mail_override)
        puts "--- [ProjectMailOverride] Project: #{project.identifier}, Module Enabled: #{enabled} ---"
        
        return unless enabled
        
        puts "--- [ProjectMailOverride] Adding settings tab ---"

        tabs = context[:tabs] || []
        tabs << {
          name: 'mail_override',
          label: 'Mail Override',
          partial: 'project_mail_settings/settings'
        }
        # Redmine uses the return value or the modified array in some versions
        return tabs
      end
    end
  end
end