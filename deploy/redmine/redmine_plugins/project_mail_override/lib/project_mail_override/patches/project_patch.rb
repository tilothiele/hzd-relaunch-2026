# plugins/project_mail_override/lib/project_mail_override/patches/project_patch.rb
module ProjectMailOverride
  module Patches
    module ProjectPatch
      def self.prepended(base)
        puts "--- [ProjectMailOverride] ProjectPatch prepended ---"
        base.class_eval do
          has_one :project_mail_setting, dependent: :destroy
        end
      end
    end
  end
end

unless Project.included_modules.include?(ProjectMailOverride::Patches::ProjectPatch)
  puts "--- [ProjectMailOverride] Prepending ProjectPatch ---"
  Project.prepend(ProjectMailOverride::Patches::ProjectPatch)
end
