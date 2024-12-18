@extends('layouts.app')
@section('title', 'Mon Profil')
@section('content')
<section class="profile-page">
    <!-- Header Section -->
    <header class="profile-header">
        <h2 class="username">{{$user->username}}</h2>
    </header>
    <div class="menu-deroulant">
    <input type="checkbox" id="menu-toggle" aria-label="bouton pour ouvrir menu des actions">

    <ul class="menu-deroulant__contenu">
        <li>
            <a href="{{ route('user.edit', $user->id) }}">Modifier</a>
        </li>
        <li>
            <form action="{{ route('user.destroy', $user->id) }}" method="POST" onsubmit="return confirm('Voulez-vous vraiment supprimer ?');">
                @csrf
                @method('DELETE')
                <button type="submit" class="menu-button">Supprimer</button>
            </form>
        </li>
        <li>
            <a href="{{ route('logout') }}" onclick="event.preventDefault(); document.getElementById('logout-form').submit();">Déconnexion</a>
            <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display: none;">
                @csrf
            </form>
        </li>
    </ul>
</div>


    <!-- Stats Section -->
    <div class="profile-stats">
        <div class="stat-item">
            <p class="stat-number">2</p>
            <p class="stat-label">Celliers</p>
        </div>
        <div class="stat-item">
            <p class="stat-number">8</p>
            <p class="stat-label">Bouteilles</p>
        </div>
        <div class="stat-item">
            <p class="stat-number">3</p>
            <p class="stat-label">À acheter</p>
        </div>
    </div>

    <!-- Placeholder for Bottles List -->
    <div class="bottles-list">
        <div class="bottle-item">
            <div class="bottle-placeholder"></div>
            <p class="bottle-name">Rouge | Shiraz</p>
            <p class="bottle-desc">Importation privée 2024 <br> 750 ml | Italie</p>
            <div class="bottle-quantity">
                <button>-</button>
                <span>2</span>
                <button>+</button>
            </div>
        </div>
        <div class="bottle-item">
            <div class="bottle-placeholder"></div>
            <p class="bottle-name">Rouge | Shiraz</p>
            <p class="bottle-desc">Importation privée 2024 <br> 750 ml | Italie</p>
            <div class="bottle-quantity">
                <button>-</button>
                <span>2</span>
                <button>+</button>
            </div>
        </div>
    </div>
</section>
@endsection
