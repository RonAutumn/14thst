import { XCircle } from 'lucide-react';

export default function ErrorPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const message = searchParams.message || 'An error occurred';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mb-6">
                    <XCircle className="mx-auto h-12 w-12 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Error
                </h1>
                <p className="text-gray-600 mb-6">
                    {message}
                </p>
                <div className="space-y-4">
                    <a
                        href="/"
                        className="block w-full bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 transition-colors"
                    >
                        Return to Home
                    </a>
                </div>
            </div>
        </div>
    );
} 