# plugins/project_mail_override/lib/project_mail_override/patches/projects_helper_patch.rb
module ProjectMailOverride
  module Patches
    module ProjectsHelperPatch
      def project_settings_tabs
        tabs = super
        
        # Check if the project module is enabled
        if @project && @project.module_enabled?(:project_mail_override) && User.current.allowed_to?(:manage_project_mail_settings, @project)
          # Check if tab already exists (e.g. from hook)
          unless tabs.any? { |t| t[:name] == 'mail_override' }
            puts "--- [ProjectMailOverride] ProjectsHelperPatch adding tab ---"
            tabs << {
              name: 'mail_override',
              label: 'Mail Override',
              partial: 'project_mail_settings/settings'
            }
          end
        end
        
        tabs
      end
    end
  end
end

unless ProjectsHelper.included_modules.include?(ProjectMailOverride::Patches::ProjectsHelperPatch)
  puts "--- [ProjectMailOverride] Prepending ProjectsHelperPatch ---"
  ProjectsHelper.prepend(ProjectMailOverride::Patches::ProjectsHelperPatch)
end
