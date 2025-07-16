# Makefile for student-tutor dev & prod environment

# Spusti vývojový režim s hot-reloadom
dev:
	docker-compose up

# Zastav bežiace kontajnery (ale nevymaž ich)
stop:
	docker-compose stop

# Zastav a vymaž kontajnery, siete a volume
down:
	docker-compose down -v

# Vyčisti cache Next.js a reštartuj frontend
reset-frontend-cache:
	docker-compose run --rm frontend rm -rf .next

# Spusti produkčné buildovanie + beh
prod:
	docker-compose -f docker-compose.yml up --build

# Len rebuildni všetky image
build:
	docker-compose build

# Reštartuj backend (užitočné ak sa niečo zacyklí)
restart-backend:
	docker-compose restart backend

# Reštartuj frontend (napr. po zmene env premenných)
restart-frontend:
	docker-compose restart frontend


make 