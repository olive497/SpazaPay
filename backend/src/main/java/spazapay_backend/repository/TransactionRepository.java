package spazapay_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import spazapay_backend.model.Transaction;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByShopIdOrderByCreatedAtDesc(Long shopId);
    Optional<Transaction> findByIdAndShopId(Long id, Long shopId);
}
