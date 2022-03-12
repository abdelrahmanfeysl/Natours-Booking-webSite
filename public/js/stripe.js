/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51KcAvmA7N2eKjWqFP4aTwUQ0t1Fio2USRZYKiEjSqbdZFFUjM0pWHQE0aw6aIMLldB4jg31UzqrzP0VdBCJk0LYb00nqLCtLDR');

export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};