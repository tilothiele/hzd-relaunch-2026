class CreateProjectMailSettings < ActiveRecord::Migration[6.1]
  def change
    create_table :project_mail_settings do |t|
      t.references :project, null: false, index: { unique: true }
      t.string :from_address
      t.string :reply_to_address
      t.timestamps
    end
  end
end