import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

// Components
import { HomePageComponent } from './pages/home/home-page.component';
import { LoginPageComponent } from './pages/auth/login-page.component';
import { RegisterPageComponent } from './pages/auth/register-page.component';
import { ProfilePageComponent } from './pages/profile/profile-page.component';
import { PostListPageComponent } from './pages/posts/post-list-page.component';
import { PostDetailPageComponent } from './pages/posts/post-detail-page.component';
import { PostEditPageComponent } from './pages/posts/post-edit-page.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard.component';

const routes: Routes = [
  // Public routes
  { path: '', component: HomePageComponent, title: 'Blog Platform - Home' },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'posts', component: PostListPageComponent, title: 'Blog Posts' },
  { path: 'posts/:id', component: PostDetailPageComponent, title: 'Post Details' },
  { path: 'tag/:tag', component: PostListPageComponent, title: 'Posts by Tag' },
  { path: 'author/:authorId', component: PostListPageComponent, title: 'Posts by Author' },
  { path: 'search', component: PostListPageComponent, title: 'Search Results' },
  
  // Authentication routes
  { path: 'login', component: LoginPageComponent, title: 'Login' },
  { path: 'register', component: RegisterPageComponent, title: 'Register' },
  
  // Protected routes (require authentication)
  { 
    path: 'profile', 
    component: ProfilePageComponent, 
    canActivate: [AuthGuard],
    title: 'My Profile'
  },
  { 
    path: 'profile/edit', 
    component: ProfilePageComponent, 
    canActivate: [AuthGuard],
    title: 'Edit Profile'
  },
  { 
    path: 'posts/new', 
    component: PostEditPageComponent, 
    canActivate: [AuthGuard],
    title: 'Create New Post'
  },
  { 
    path: 'posts/:id/edit', 
    component: PostEditPageComponent, 
    canActivate: [AuthGuard],
    title: 'Edit Post'
  },
  
  // Admin routes (require admin role)
  { 
    path: 'admin', 
    component: AdminDashboardComponent, 
    canActivate: [AuthGuard, AdminGuard],
    title: 'Admin Dashboard',
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent, title: 'Admin Dashboard' },
      { path: 'posts', component: AdminDashboardComponent, title: 'Manage Posts' },
      { path: 'users', component: AdminDashboardComponent, title: 'Manage Users' },
      { path: 'comments', component: AdminDashboardComponent, title: 'Moderate Comments' },
      { path: 'analytics', component: AdminDashboardComponent, title: 'Analytics' }
    ]
  },
  
  // Error routes
  { path: '404', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled',
    scrollOffset: [0, 64], // Account for fixed header
    onSameUrlNavigation: 'reload'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
