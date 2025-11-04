import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { AlertTriangle, Home, LogOut } from 'lucide-react';

const UnlinkedErrorPage: React.FC = () => {
  const { logout } = useAuth0();

  const handleLogout = () => {
    logout({ 
      logoutParams: { 
        returnTo: window.location.origin 
      } 
    });
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Account Not Linked
            </h2>
            <div className="text-gray-600 space-y-4">
              <p>
                Your user account is not linked to a tenant record in the system.
              </p>
              <p>
                Please contact the administrator to link your account to a tenant before you can access the application.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-6">
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">What you need to do:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Contact your building administrator</li>
                    <li>Provide them with your email address: <span className="font-mono bg-blue-100 px-1 rounded">{localStorage.getItem('userEmail') || 'your-email@example.com'}</span></li>
                    <li>Ask them to link your account to your tenant record</li>
                    <li>Log back in once the linking is complete</li>
                  </ol>
                </div>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <button
                onClick={handleGoHome}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home Page
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-red-600 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlinkedErrorPage;