# lib/project_mail_override/mailer_patch.rb

module ProjectMailOverride
  module MailerPatch
    def self.included(base)
      base.class_eval do
        alias_method :mail_without_project_override, :mail
        alias_method :mail, :mail_with_project_override
      end
    end

    def mail_with_project_override(headers = {}, &block)
      project = headers[:project]

      if project
        setting = project.project_mail_setting

        if setting
          headers[:from] = setting.effective_from if setting.effective_from
          headers[:reply_to] = setting.effective_reply_to if setting.effective_reply_to
        end
      end

      mail_without_project_override(headers, &block)
    end
  end
end

Mailer.include ProjectMailOverride::MailerPatch