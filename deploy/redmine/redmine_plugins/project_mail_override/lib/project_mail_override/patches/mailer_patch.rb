# plugins/project_mail_override/lib/project_mail_override/patches/mailer_patch.rb
module ProjectMailOverride
  module Patches
    module MailerPatch
      def mail(headers = {}, &block)
        project = headers[:project]

        if project
          setting = project.project_mail_setting

          if setting
            headers[:from] = setting.effective_from if setting.effective_from.present?
            headers[:reply_to] = setting.effective_reply_to if setting.effective_reply_to.present?
          end
        end

        super(headers, &block)
      end
    end
  end
end

unless Mailer.included_modules.include?(ProjectMailOverride::Patches::MailerPatch)
  Mailer.prepend(ProjectMailOverride::Patches::MailerPatch)
end
