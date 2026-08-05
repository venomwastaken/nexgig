import { useState } from 'react';

export default function PaystackCheckout() {
  const [email, setEmail] = useState('customer@example.com');
  const [amount, setAmount] = useState(5000); // Amount in Kobo/Pesewas (5000 = 50.00 GHS/NGN)
  const [loading, setLoading] = useState(false);

  const handlePayment = (e: any) => {
    e.preventDefault();
    setLoading(true);

    // Ensure the Paystack class is available on the global window object
    if (!window.PaystackPop) {
      alert("Paystack SDK failed to load. Please check your internet connection.");
      setLoading(false);
      return;
    }

    // Initialize Paystack V2 instance
    const paystack = new window.PaystackPop();

    paystack.newTransaction({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY, // Vite env syntax
      email: email,
      amount: amount,
      currency: 'GHS', // Set your currency: GHS, NGN, USD, ZAR, etc.
      
      // Inline V2 Callback naming updates
      onSuccess: function (response: any) {
        setLoading(false);
        // This fires upon successful checkout payment
        alert(`Payment successful! Reference: ${response.reference}`);
        console.log("Paystack Response:", response);
        
        // OPTIONAL: Send response.reference to your backend server to verify payment securely.
      },
      onCancel: function () {
        setLoading(false);
        // This fires if the customer intentionally closes the modal
        alert("Transaction cancelled by user.");
      },
      onError: function (error: any) {
        setLoading(false);
        alert("An error occurred during checkout initialization.");
        console.error(error);
      }
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Vite + Paystack Checkout</h2>
      <form onSubmit={handlePayment}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block' }}>Email Address:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#ccc' : '#3bb75e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Opening Checkout...' : 'Pay Now'}
        </button>
      </form>
    </div>
  );
}
