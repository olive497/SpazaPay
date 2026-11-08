package spazapay_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import spazapay_backend.model.Shop;

import java.util.Optional;

public interface ShopRepository extends JpaRepository<Shop, Long> {
    Optional<Shop> findByEmail(String email);
    boolean existsByEmail(String email);
}