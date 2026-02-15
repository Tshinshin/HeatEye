import { Suspense } from "react";
import ChangePasswordClient from "./ChangePasswordClient";

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ChangePasswordClient />
      </Suspense>
    </div>
  );
}
