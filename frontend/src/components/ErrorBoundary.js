import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4" data-testid="app-error-boundary">
          <div className="neumorphic-card rounded-2xl p-8 max-w-md text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-slate-600 mb-6">The app hit an unexpected error. Reloading usually fixes it.</p>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
              Reload
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
