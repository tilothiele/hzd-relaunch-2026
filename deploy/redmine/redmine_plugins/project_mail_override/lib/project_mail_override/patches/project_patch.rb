module ProjectMailOverride
  module Patches
    module ProjectPatch
      puts "--- [ProjectMailOverride] ProjectPatch module loaded ---"
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
