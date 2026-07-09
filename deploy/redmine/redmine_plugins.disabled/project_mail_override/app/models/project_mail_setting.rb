# app/models/project_mail_setting.rb

class ProjectMailSetting < ActiveRecord::Base
  belongs_to :project

  validates :from_address, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :reply_to_address, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true

  def effective_from
    from_address.presence || Setting.mail_from
  end

  def effective_reply_to
    reply_to_address.presence
  end
end