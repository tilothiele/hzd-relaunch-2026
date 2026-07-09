class AddSendNotificationToProjectMailSettings < ActiveRecord::Migration[6.1]
  def change
    add_column :project_mail_settings, :send_notification_on_create, :boolean, default: false, null: false
  end
end
