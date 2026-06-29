import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  NavigationEnd,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout" [class.collapsed]="collapsed">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2 *ngIf="!collapsed">🗳️ Voting</h2>
          <span *ngIf="collapsed" class="logo-icon">🗳️</span>
        </div>
        <nav>
          <div class="nav-section">
            <div class="nav-section-title" *ngIf="!collapsed">Main</div>
            <a
              routerLink="/dashboard"
              routerLinkActive="active"
              class="nav-item"
              title="Dashboard"
            >
              <span class="nav-icon">📊</span>
              <span class="nav-label" *ngIf="!collapsed">Dashboard</span>
            </a>
            <a
              routerLink="/profile"
              routerLinkActive="active"
              class="nav-item"
              title="Profile"
            >
              <span class="nav-icon">👤</span>
              <span class="nav-label" *ngIf="!collapsed">Profile</span>
            </a>
          </div>
          <div class="nav-section">
            <div class="nav-section-title" *ngIf="!collapsed">Voting</div>
            <a
              routerLink="/voting/candidates"
              routerLinkActive="active"
              class="nav-item"
              title="Manage Candidates"
            >
              <span class="nav-icon">🎯</span>
              <span class="nav-label" *ngIf="!collapsed"
                >Manage Candidates</span
              >
            </a>
            <a
              routerLink="/voting/register"
              routerLinkActive="active"
              class="nav-item"
              title="Register Voter"
            >
              <span class="nav-icon">📝</span>
              <span class="nav-label" *ngIf="!collapsed">Register Voter</span>
            </a>
            <a
              routerLink="/voting/manage-voters"
              routerLinkActive="active"
              class="nav-item"
              title="Manage Voters"
            >
              <span class="nav-icon">🗂️</span>
              <span class="nav-label" *ngIf="!collapsed">Manage Voters</span>
            </a>
            <a
              routerLink="/voting/manage-elections"
              routerLinkActive="active"
              class="nav-item"
              title="Manage Elections"
            >
              <span class="nav-icon">📋</span>
              <span class="nav-label" *ngIf="!collapsed">Manage Elections</span>
            </a>
            <a
              routerLink="/voting/cast-vote"
              routerLinkActive="active"
              class="nav-item"
              title="Cast Vote"
            >
              <span class="nav-icon">✅</span>
              <span class="nav-label" *ngIf="!collapsed">Cast Vote</span>
            </a>
            <a
              routerLink="/voting/results"
              routerLinkActive="active"
              class="nav-item"
              title="Results"
            >
              <span class="nav-icon">📈</span>
              <span class="nav-label" *ngIf="!collapsed">Results</span>
            </a>
          </div>
          <div class="nav-section">
            <div class="nav-section-title" *ngIf="!collapsed">Tools</div>
            <a
              routerLink="/blockchain"
              routerLinkActive="active"
              class="nav-item"
              title="Blockchain Explorer"
            >
              <span class="nav-icon">⛓️</span>
              <span class="nav-label" *ngIf="!collapsed"
                >Blockchain Explorer</span
              >
            </a>
          </div>
        </nav>
        <div class="sidebar-footer">
          <button (click)="logout()" class="logout-btn">
            <span *ngIf="!collapsed">Logout</span>
            <span *ngIf="collapsed" class="nav-icon">🚪</span>
          </button>
        </div>
      </aside>
      <button
        class="toggle-btn"
        (click)="collapsed = !collapsed"
        [class.collapsed]="collapsed"
      >
        {{ collapsed ? '→' : '←' }}
      </button>
      <main class="main-content">
        <header class="top-bar">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </header>
        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .layout {
        display: flex;
        min-height: 100vh;
      }
      .sidebar {
        width: 260px;
        background: #1a1a2e;
        color: white;
        display: flex;
        flex-direction: column;
        position: fixed;
        height: 100vh;
        overflow-y: auto;
        z-index: 100;
        transition: width 0.3s ease;
      }
      .layout.collapsed .sidebar {
        width: 70px;
      }
      .sidebar-header {
        padding: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 60px;
      }
      .sidebar-header h2 {
        margin: 0;
        font-size: 1.3rem;
      }
      .logo-icon {
        font-size: 1.5rem;
      }
      nav {
        flex: 1;
        padding: 1rem 0;
      }
      .nav-section {
        margin-bottom: 1.5rem;
      }
      .nav-section-title {
        padding: 0 1.5rem;
        font-size: 0.7rem;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.4);
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
      }
      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem 1.5rem;
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        font-size: 0.95rem;
        transition: all 0.2s;
        border-left: 3px solid transparent;
        cursor: pointer;
      }
      .layout.collapsed .nav-item {
        padding: 0.6rem;
        justify-content: center;
        border-left: none;
      }
      .nav-item:hover {
        background: rgba(255, 255, 255, 0.05);
        color: white;
      }
      .nav-item.active {
        background: rgba(67, 97, 238, 0.2);
        color: #7b93f5;
        border-left-color: #4361ee;
      }
      .nav-icon {
        font-size: 1.1rem;
        flex-shrink: 0;
        width: 20px;
        text-align: center;
      }
      .sidebar-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      .logout-btn {
        width: 100%;
        padding: 0.6rem;
        background: rgba(220, 38, 38, 0.2);
        color: #f87171;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .logout-btn:hover {
        background: rgba(220, 38, 38, 0.3);
      }
      .toggle-btn {
        position: fixed;
        top: 16px;
        left: 260px;
        z-index: 200;
        width: 28px;
        height: 28px;
        background: #1a1a2e;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: left 0.3s ease;
      }
      .toggle-btn.collapsed {
        left: 70px;
      }
      .main-content {
        flex: 1;
        margin-left: 260px;
        background: #f5f6fa;
        min-height: 100vh;
        transition: margin-left 0.3s ease;
      }
      .layout.collapsed .main-content {
        margin-left: 70px;
      }
      .top-bar {
        background: white;
        padding: 1rem 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        position: sticky;
        top: 0;
        z-index: 50;
      }
      .page-title {
        margin: 0;
        font-size: 1.4rem;
        color: #1a1a2e;
      }
      .content {
        padding: 2rem;
      }
    `,
  ],
})
export class LayoutComponent implements OnInit, OnDestroy {
  pageTitle = 'Dashboard';
  collapsed = false;
  private routerSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.pageTitle = this.getTitleFromUrl(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.pageTitle = this.getTitleFromUrl(event.url);
      });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  private getTitleFromUrl(url: string): string {
    if (url.includes('/dashboard')) return 'Dashboard';
    if (url.includes('/profile')) return 'Profile';
    if (url.includes('/users')) return 'Users';
    if (url.includes('/companies')) return 'Companies';
    if (url.includes('/voting/candidates')) return 'Manage Candidates';
    if (url.includes('/voting/register')) return 'Register Voter';
    if (url.includes('/voting/manage-voters')) return 'Manage Voters';
    if (url.includes('/voting/manage-elections')) return 'Manage Elections';
    if (url.includes('/voting/cast-vote')) return 'Cast Vote';
    if (url.includes('/voting/results')) return 'Vote Results';
    if (url.includes('/blockchain')) return 'Blockchain Explorer';
    return 'Dashboard';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
