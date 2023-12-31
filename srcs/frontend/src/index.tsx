//react router
import ReactDOM from 'react-dom/client';
import {
	createBrowserRouter,
	createRoutesFromElements,
	Route,
	RouterProvider,
	Outlet,
	redirect
} from 'react-router-dom';

//import component
import { Login, LandingPage, TwoFAPage } from './pages/Login';
import { Signin } from './utils/Signin';
import { Signup } from './utils/Signup';
import Sidebar from './pages/Sidebar'
import GamePage from './pages/GamePage';
import Profile from './pages/Profile';
import { Setting, TwoFactorAuth, SettingMenu } from './pages/ProfileSetting';
import { Search } from './pages/Search';
import { Friends } from './pages/Friends';
import { Chat, ChatBox } from './pages/Chat';
import { UserProfile } from './utils/UserProfile';
import { DefaultErrorPage } from './pages/DefaultErrorPage';
import { DefaultFriendPage } from './pages/DefaultFriendPage';
import { DefaultSearchPage } from './pages/DefaultSearchPage';

//bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/customButton.css';

// css
import './styles/index.css';
import './styles/iconButton.css';
import './styles/Chat.css';
import './styles/Stat.css';

// sentry
import * as Sentry from "@sentry/react";

import { CallBack42, Protected } from './utils/AuthProvider';
import { Guest } from './utils/Guest';

import axios from 'axios';
import reportWebVitals from './reportWebVitals';

Sentry.init({
	dsn: "https://01bf5be943109047867ae54d1eb150a7@o4506224690200576.ingest.sentry.io/4506224693542912",
	integrations: [
	  new Sentry.BrowserTracing({
		// Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
		tracePropagationTargets: ["localhost", /^https:\/\/pongpong\.me/],
	  }),
	  new Sentry.Replay(),
	],
	// Performance Monitoring
	tracesSampleRate: 1.0, // Capture 100% of the transactions
	// Session Replay
	replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
	replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });

axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;
axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');

async function loader(route: string, param?: string, refresh = false) {
	const baseUrl = process.env.REACT_APP_BACKEND_URL + '/';
	const token = localStorage.getItem('token') || null;
	const refreshToken = localStorage.getItem('refreshToken') || null;
	const fetchUrl = param ? (`${baseUrl}${route}/${param}`) : (`${baseUrl}${route}`);

	if (!token && !refreshToken) {
		return redirect("/login");
	}

	const res = await fetch(fetchUrl, {
		headers: { 'Authorization': `Bearer ${token}` }
	})
	if (res.status == 200 || res.status == 201) {
		return (res.json());
	}
	if (refresh) {
		throw new Response(res.statusText, { status: res.status });
	}
	return fetch(process.env.REACT_APP_BACKEND_URL + `/auth/refreshToken`, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			"Content-Type": "application/json"
		},
		body: JSON.stringify({ "refreshToken": refreshToken })
	}).then(async (res): Promise<Response> => {
		if (res.status != 201) {
			localStorage.removeItem('token');
			localStorage.removeItem('refreshToken');
			localStorage.removeItem('firstConnexion');
			return redirect("/login");
			// throw new Response(res.statusText, { status: res.status })
		}
		const newTokens = await res.json();
		localStorage.setItem('token', newTokens.token);
		localStorage.setItem('refreshToken', newTokens.refreshToken);
		localStorage.setItem('firstConnexion', newTokens.firstConnexion);
		return loader(route, param, true);
	})

}

const router = createBrowserRouter(
	createRoutesFromElements(
		<Route element={<Outlet />} errorElement={<DefaultErrorPage />}>

			<Route element={<Guest />}>
				<Route path="login" element={<Login />}>
					<Route index element={<LandingPage />}></Route>
					<Route path="signin" element={<Signin />}></Route>
					<Route path="signup" element={<Signup />}></Route>
					<Route path="2fa" element={<TwoFAPage />}></Route>
				</Route>
			</Route>

			<Route path='/42/callback' element={<CallBack42 />} />

			<Route element={<Protected />} loader={() => (loader('auth', 'isTokenValid'))}>
				<Route path="/" element={<Sidebar />}>

					<Route index element={<GamePage />} loader={() => (loader('auth', 'isTokenValid'))} />

					<Route path='me' element={<Outlet />}>
						<Route index element={<Profile />} loader={() => (loader('profile', 'me'))} />
						<Route path="setting" element={<Outlet />}>
							<Route index element={<SettingMenu />} loader={() => (loader('profile', 'me'))} />
							<Route path='2fa' element={<TwoFactorAuth />} />
						</Route>
					</Route>

					<Route path="search" element={<Search />} loader={() => (loader('users', 'all'))}>
						<Route index element={<DefaultSearchPage />} />
						<Route
							path=':userNick'
							element={<UserProfile />}
							loader={({ params }) => (loader('profile', params.userNick))}
						/>
					</Route>

					<Route path="friends" element={<Friends />}>
						<Route index element={<DefaultFriendPage />} />
						<Route
							path=':userNick'
							element={<UserProfile />}
							loader={({ params }) => (loader('profile', params.userNick))}
						/>
					</Route>

					<Route path="chat" element={<Chat />}>
						<Route
							path=':chatId'
							element={<ChatBox />}
							loader={({ params }) => (loader('rooms', params.chatId))}
						/>
					</Route>
				</Route>
			</Route>
		</Route>
	)
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	// with strict mode, fetch fails. I don't know why
	// <React.StrictMode>
	<RouterProvider router={router} />
	// </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
