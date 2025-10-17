import {createRouter, createWebHistory} from "vue-router";
import {subscribeToAuthStateChanges} from "../services/auth";

import Home from "../pages/Home.vue";
import PostsFeed from "../pages/PostsFeed.vue";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import MyProfile from "../pages/MyProfile.vue";
import MyProfileEdit from "../pages/MyProfileEdit.vue";


const routes = [
  {path: "/", component: Home},
  {path: "/feed", component: PostsFeed, meta: {requiresAuth: true}},
  {path: "/ingresar", component: Login},
  {path: "/crear-cuenta", component: Register},
  {path: "/mi-perfil", component: MyProfile, meta: {requiresAuth: true}},
  {path: "/mi-perfil/editar", component: MyProfileEdit, meta: {requiresAuth: true}},
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

router.beforeEach((to) => {
  if (to.meta.requiresAuth && user.id === null) {
    return '/ingresar';
  }
})

export default router;