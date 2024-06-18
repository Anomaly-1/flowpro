import '../app/globals.css';
import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import PageTransition from '../components/PageTransition';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <PageTransition key={router.route}>
      <Component {...pageProps} />
    </PageTransition>
  );
}

export default MyApp;
