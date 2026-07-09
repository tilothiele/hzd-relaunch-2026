# config/routes.rb

Rails.application.routes.draw do
  resources :projects do
    resource :mail_settings,
             controller: 'project_mail_settings',
             only: [:edit, :update]
  end
end
