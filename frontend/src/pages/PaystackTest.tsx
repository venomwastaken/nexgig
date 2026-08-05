declare global {
    interface Window {
        PaystackPop: any;
    }
}

export default function PaystackTest() {
    function handleTestPay() {
        const popup = new window.PaystackPop();
        popup.newTransaction({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string,
            email: "test@example.com",
            amount: 5000, // ₵50 in the smallest currency unit
            ref: `test_${Date.now()}`,
            onSuccess: (transaction: { reference: string }) => {
                alert("Payment successful! Reference: " + transaction.reference);
            },
            onCancel: () => {
                alert("Payment window closed.");
            },
        });
    }

    return (
        <div style={{ padding: "40px" }}>
            <h1>Paystack Test</h1>
            <button
                onClick={handleTestPay}
                style={{
                    background: "#059669",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                }}
            >
                Test Payment (₵50)
            </button>
        </div>
    );
}