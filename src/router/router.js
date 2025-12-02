import {createRouter, createWebHistory} from "vue-router";
import {subscribeToAuthStateChanges, waitForAuthInitialization} from "../services/auth";

import Home from "../pages/Home.vue";
import PostsFeed from "../pages/PostsFeed.vue";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import MyProfile from "../pages/MyProfile.vue";
import MyProfileEdit from "../pages/MyProfileEdit.vue";
import UserProfile from "../pages/UserProfile.vue";
import PrivateChat from "../pages/PrivateChat.vue";

const routes = [
  {path: "/", component: Home},
  {path: "/feed", component: PostsFeed, meta: {requiresAuth: true}},
  {path: "/ingresar", component: Login},
  {path: "/crear-cuenta", component: Register},
  {path: "/mi-perfil", component: MyProfile, meta: {requiresAuth: true}},
  {path: "/mi-perfil/editar", component: MyProfileEdit, meta: {requiresAuth: true}},
  {path: "/usuario/:id", component: UserProfile, meta: {requiresAuth: true}},
  {path: '/usuario/:id/chat', component: PrivateChat, meta: {requiresAuth: true,},},
];

const router = createRouter({
  routes,
  history: createWebHistory(),
});

let user = {
  id: null,
  email: null,
}
subscribeToAuthStateChanges(newUserState => user = newUserState);

router.beforeEach(async (to) => {
  // Esperar a que la autenticación se inicialice
  await waitForAuthInitialization();

  if (to.meta.requiresAuth && user.id === null) {
    return '/ingresar';
  }

  // Evitar que usuarios autenticados vayan a login/register
  if ((to.path === '/ingresar' || to.path === '/crear-cuenta') && user.id !== null) {
    return '/feed'; // o '/' según tu preferencia
  }
})

export default router;