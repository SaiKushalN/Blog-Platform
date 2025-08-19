import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatGridListModule } from '@angular/material/grid-list';

// Third-party modules
import { ToastrModule } from 'ngx-toastr';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

// App Components
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from './components/error-message/error-message.component';

// App Pages
import { HomePageComponent } from './pages/home/home-page.component';
import { LoginPageComponent } from './pages/auth/login-page.component';
import { RegisterPageComponent } from './pages/auth/register-page.component';
import { ProfilePageComponent } from './pages/profile/profile-page.component';
import { PostListPageComponent } from './pages/posts/post-list-page.component';
import { PostDetailPageComponent } from './pages/posts/post-detail-page.component';
import { PostEditPageComponent } from './pages/posts/post-edit-page.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard.component';

// App Services
import { AuthService } from './services/auth.service';
import { PostService } from './services/post.service';
import { CommentService } from './services/comment.service';
import { UserService } from './services/user.service';
import { WebSocketService } from './services/websocket.service';
import { NotificationService } from './services/notification.service';
import { FileUploadService } from './services/file-upload.service';

// App Guards
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

// App Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

// App Routing
import { AppRoutingModule } from './app-routing.module';

// Shared Components
import { PostCardComponent } from './components/post-card/post-card.component';
import { CommentListComponent } from './components/comment-list/comment-list.component';
import { CommentFormComponent } from './components/comment-form/comment-form.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { TagCloudComponent } from './components/tag-cloud/tag-cloud.component';
import { UserAvatarComponent } from './components/user-avatar/user-avatar.component';

@NgModule({
  declarations: [
    // Main App Component
    AppComponent,
    
    // Layout Components
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    
    // Page Components
    HomePageComponent,
    LoginPageComponent,
    RegisterPageComponent,
    ProfilePageComponent,
    PostListPageComponent,
    PostDetailPageComponent,
    PostEditPageComponent,
    AdminDashboardComponent,
    
    // Shared Components
    PostCardComponent,
    CommentListComponent,
    CommentFormComponent,
    SearchBarComponent,
    TagCloudComponent,
    UserAvatarComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    AppRoutingModule,
    
    // Angular Material
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatMenuModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatExpansionModule,
    MatDividerModule,
    MatListModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatCheckboxModule,
    MatRadioModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    MatSidenavModule,
    MatGridListModule,
    
    // Third-party modules
    ToastrModule.forRoot({
      timeOut: 5000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true
    }),
    InfiniteScrollModule
  ],
  providers: [
    // Services
    AuthService,
    PostService,
    CommentService,
    UserService,
    WebSocketService,
    NotificationService,
    FileUploadService,
    
    // Guards
    AuthGuard,
    AdminGuard,
    
    // Interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
