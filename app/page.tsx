import { redirect } from 'next/navigation';

/**
 * Root page - redirects to /cart
 */
export default function Home() {
  redirect('/cart');
}
