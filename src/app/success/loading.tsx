export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mb-6">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Processing Order...
                </h1>
                <p className="text-gray-600">
                    Please wait while we confirm your order.
                </p>
            </div>
        </div>
    );
} 